import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthorsService } from '../../services/authors.service';
import { HttpResponse } from '@angular/common/http';
import { AuthorModel } from '../../models/author.model';
import { CategoriesService } from '../../services/categories.service';
import { CategoryModel } from '../../models/category.model';
import { PerspectiveService } from '../../services/perspectives.service';
import { PerspectiveModel } from '../../models/perspective.model';
import { Router, ActivatedRoute, Params } from '../../../../../../node_modules/@angular/router';
import { NgbModal, ModalDismissReasons } from '../../../../../../node_modules/@ng-bootstrap/ng-bootstrap';
import { ConfirmationModalComponent } from '../../../shared/components/confirmation-modal/confirmation-modal.component';
import { ToastrService } from '../../../../../../node_modules/ngx-toastr';
import { AuthenticationService } from '../../../auth/services/authentication.service';

@Component({
    selector: 'm-pers-perspective',
    templateUrl: './perspective-profile.component.html',
    styleUrls: ['./perspective-profile.component.scss']
})
export class PerspectiveProfileComponent implements OnInit, OnDestroy {

    private perspective: PerspectiveModel;

    readOnlyForm: boolean = true;
    modifiedPerspective: any = {};
    authors: AuthorModel[] = [];
    categories: CategoryModel[] = [];

    private perspectiveSubscription: Subscription;
    private paramsSubscription: Subscription;
    private authorsSubscription: Subscription;
    private categoriesSubscription: Subscription;

    constructor(private router: Router,
        private route: ActivatedRoute,
        private authorsService: AuthorsService,
        private categoriesService: CategoriesService,
        private perspectiveService: PerspectiveService,
        private modalService: NgbModal,
        private toastr: ToastrService,
        private authenticationService: AuthenticationService) { }

    ngOnInit() {
        const perspectiveId: number = parseInt(this.route.snapshot.params['id']);
        if (isNaN(perspectiveId)) {
            this.router.navigate(['404']);
        }

        this.perspectiveSubscription = this.perspectiveService.getPerspective(perspectiveId).subscribe(
            (response: HttpResponse<PerspectiveModel>) => {
                this.perspective = response.body;
                this.fillForm();
            },
            error => {
                this.toastr.error('Something went wrong trying to fetch the Perspective.', 'Inconvenient');
            }
        );

        this.paramsSubscription = this.route.params.subscribe(
            (params: Params) => {
                // this.perspective.id =  params['id'];
            },
            error => {
                console.log(error);
            }
        );

        this.authorsSubscription = this.authorsService.getAuthors().subscribe(
            (response: HttpResponse<AuthorModel[]>) => {
                this.authors = response.body;
            },
            error => {
                this.toastr.error('Something went wrong trying to fetch the Authors.', 'Inconvenient');
            }
        );

        this.categoriesSubscription = this.categoriesService.getCategories().subscribe(
            (response: HttpResponse<CategoryModel[]>) => {
                this.categories = response.body;
            },
            error => {
                this.toastr.error('Something went wrong trying to fetch the Categories.', 'Inconvenient');
            }
        );
    }

    openConfirmation() {
        const modalRef = this.modalService.open(ConfirmationModalComponent, {ariaLabelledBy: 'modal-basic-title'});
        modalRef.componentInstance.message = 'You are about to delete this Perspective permanently.';
        modalRef.componentInstance.confirmationButtonMessage = 'Delete Perspective';

        modalRef.result.then(
            (result) => {
                if (result) {
                    this.deletePerspective();
                }
            }, (reason) => {
            });
      }

    changeReadOnlyForm () {
        this.readOnlyForm = !this.readOnlyForm;
    }

    processingForm(): void {
        this.perspectiveService.modifyPerspective(this.modifiedPerspective).subscribe(
            (response: HttpResponse<PerspectiveModel>) => {
                this.toastr.success('The modification has been successful.', 'Congratulation, ' + this.authenticationService.getUsername() + '.');
                this.changeReadOnlyForm();
            },
            error => {
                this.toastr.error(error, 'Inconvenient');
            }
        );
    }

    private deletePerspective(): void {
        this.perspectiveService.deletePerspective(this.perspective.id).subscribe(
            (response: HttpResponse<any>) => {
                this.toastr.success('Your perspective has been deleted.', 'Congratulation, ' + this.authenticationService.getUsername() + '.');
                this.router.navigate(['perspectives']);
            },
            (error) => {
                this.toastr.error(error, 'Inconvenient');
            }
        );
    }

    private fillForm(): void {
        this.modifiedPerspective.id = this.perspective.id;
        this.modifiedPerspective.perspective = this.perspective.perspective;
        this.modifiedPerspective.thoughts = this.perspective.thoughts;
        if (this.perspective.author) {
            this.modifiedPerspective.authorId = this.perspective.author.id;
        }
        if (this.perspective.category) {
            this.modifiedPerspective.categoryId = this.perspective.category.id;
        }
    }

    resetForm(): void {
        this.fillForm();
        this.changeReadOnlyForm();
    }

    ngOnDestroy() {
        this.perspectiveSubscription.unsubscribe();
        this.paramsSubscription.unsubscribe();
        this.categoriesSubscription.unsubscribe();
        this.authorsSubscription.unsubscribe();
    }

}